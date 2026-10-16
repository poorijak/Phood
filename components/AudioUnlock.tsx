"use client";
import { useEffect } from "react";
import { installAudioUnlock } from "@/lib/speak";

// ปลดล็อกเสียงตั้งแต่การแตะครั้งแรกในแอป (เช่นปุ่ม "เริ่ม") เพื่อให้เสียงจาก API เล่นอัตโนมัติได้ใน Safari
export default function AudioUnlock() {
  useEffect(() => { installAudioUnlock(); }, []);
  return null;
}
