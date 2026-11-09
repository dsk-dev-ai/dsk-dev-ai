"use client";

import { useEffect, useState } from "react";
import { formatDate, timeAgo } from "@/lib/data";

export default function TimeAgo({ iso, className }: { iso: string; className?: string }) {
  const [label, setLabel] = useState(() => formatDate(iso));

  useEffect(() => {
    function tick() {
      setLabel(timeAgo(iso));
    }
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, [iso]);

  return (
    <time dateTime={iso} title={formatDate(iso)} className={className}>
      {label}
    </time>
  );
}
