"use client";
import React from "react";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="btn-ghost"
      style={{ marginTop: "0.625rem", width: "100%", padding: "0.6rem 1rem", fontSize: "0.82rem" }}
    >
      Sign out
    </button>
  );
}
