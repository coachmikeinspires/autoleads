/**
 * AutoLeads Background Worker
 * Processes sequence enrollments, sends emails, and tracks metrics.
 * 
 * Run with: node scripts/worker.js
 * For production, use PM2: pm2 start scripts/worker.js --name autoleads-worker
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();
const logger = console;

// Configure email transport (placeholder — configure with real SMTP)
const emailTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: process.env.SMTP_PORT || 1025,
  secure: false,
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
});

// Rate limiter: max 100 sends per minute
let sendCount = 0;
let lastResetTime = Date.now();

function rateLimitCheck() {
  const now = Date.now();
  if (now - lastResetTime > 60000) {
    sendCount = 0;
    lastResetTime = now;
  }
  return sendCount < 100;
}

async function sendEmail(toEmail, subject, body) {
  try {
    if (!rateLimitCheck()) {
      logger.warn('Rate limit reached for email sending');
      return false;
    }
    await emailTransport.sendMail({
      from: process.env.SMTP_FROM || 'noreply@autoleads.local',
      to: toEmail,
      subject,
      html: body,
    });
    sendCount++;
    return true;
  } catch (err) {
    logger.error('Email send error:', err.message);
    return false;
  }
}

async function processSequenceEnrollments() {
  try {
    logger.log('[WORKER] Processing active enrollments...');
    
    const enrollments = await prisma.sequenceEnrollment.findMany({
      where: { status: 'active' },
      include: { lead: true, sequence: { include: { steps: true } } },
      take: 50, // Process in batches
    });

    for (const enrollment of enrollments) {
      const step = enrollment.sequence.steps[enrollment.currentStep];
      if (!step) {
        // No more steps; mark as completed
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { status: 'completed' },
        });
        logger.log(`[ENROLLMENT] ${enrollment.id} completed`);
        continue;
      }

      // Check delay
      const lastSend = await prisma.emailSend.findFirst({
        where: { enrollmentId: enrollment.id },
        orderBy: { sentAt: 'desc' },
      });

      const delayMs = step.delayDays * 24 * 60 * 60 * 1000;
      const shouldSend = !lastSend || Date.now() - new Date(lastSend.sentAt).getTime() >= delayMs;

      if (shouldSend && enrollment.lead.email) {
        const sent = await sendEmail(enrollment.lead.email, step.subject, step.body);
        if (sent) {
          await prisma.emailSend.create({
            data: {
              enrollmentId: enrollment.id,
              stepId: step.id,
              sentAt: new Date(),
            },
          });
          // Advance to next step
          await prisma.sequenceEnrollment.update({
            where: { id: enrollment.id },
            data: { currentStep: enrollment.currentStep + 1 },
          });
          logger.log(`[EMAIL_SEND] ${enrollment.id} step ${step.stepNumber} sent to ${enrollment.lead.email}`);
        }
      }
    }
  } catch (err) {
    logger.error('[WORKER_ERROR]', err.message, err.stack);
  }
}

async function processSyncRuns() {
  try {
    logger.log('[WORKER] Checking for pending sync runs...');
    
    const pendingRuns = await prisma.syncRun.findMany({
      where: { status: 'running' },
      take: 10,
    });

    for (const run of pendingRuns) {
      // Placeholder: in production, this would call a lead source API
      logger.log(`[SYNC_RUN] Processing ${run.id}...`);
      // For demo, mark as completed immediately
      await prisma.syncRun.update({
        where: { id: run.id },
        data: { status: 'completed', completedAt: new Date(), insertedCount: run.requestedCount },
      });
      logger.log(`[SYNC_RUN] ${run.id} completed`);
    }
  } catch (err) {
    logger.error('[SYNC_ERROR]', err.message, err.stack);
  }
}

async function loop() {
  const start = Date.now();
  
  try {
    await processSequenceEnrollments();
    await processSyncRuns();
  } catch (err) {
    logger.error('[LOOP_ERROR]', err.message);
  }

  const elapsed = Date.now() - start;
  const nextDelay = Math.max(5000 - elapsed, 1000);
  logger.log(`[WORKER] Next run in ${nextDelay}ms`);
  setTimeout(loop, nextDelay);
}

process.on('SIGINT', async () => {
  logger.log('[WORKER] SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.log('[WORKER] SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

logger.log('[WORKER] Starting AutoLeads background worker...');
loop();
