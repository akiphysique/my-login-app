import { Suspense } from "react";
import DashboardContent from "./DashboardContent";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <DashboardContent />
    </Suspense>
  );
}