"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const RedirectToPositions: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/positions");
  }, [router]);

  return null;
};

export default RedirectToPositions;
