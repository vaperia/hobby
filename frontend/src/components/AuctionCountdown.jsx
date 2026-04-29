import { useEffect, useMemo, useRef, useState } from "react";

function getTimeParts(targetDate) {
  const end = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = end - now;

  if (!targetDate || Number.isNaN(end) || diff <= 0) {
    return {
      isEnded: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSeconds = Math.floor(diff / 1000);

  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return {
    isEnded: false,
    days,
    hours,
    minutes,
    seconds,
  };
}

function formatStatus(status) {
  if (!status) return "";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function AuctionCountdown({
  endsAt,
  status,
  compact = false,
  onEnd,
}) {
  const [time, setTime] = useState(() => getTimeParts(endsAt));
  const hasTriggeredEndRef = useRef(false);

  const isAuctionEndedByStatus = status && status !== "ACTIVE";

  useEffect(() => {
    hasTriggeredEndRef.current = false;
    setTime(getTimeParts(endsAt));

    const interval = setInterval(() => {
      const nextTime = getTimeParts(endsAt);
      setTime(nextTime);

      if (nextTime.isEnded) {
        clearInterval(interval);

        if (!hasTriggeredEndRef.current && onEnd && !isAuctionEndedByStatus) {
          hasTriggeredEndRef.current = true;
          onEnd();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt, onEnd, isAuctionEndedByStatus]);

  const label = useMemo(() => {
    if (isAuctionEndedByStatus) {
      return formatStatus(status);
    }

    if (time.isEnded) {
      return "Auction Ended";
    }

    if (compact) {
      if (time.days > 0) {
        return `${time.days}d ${time.hours}h ${time.minutes}m`;
      }

      if (time.hours > 0) {
        return `${time.hours}h ${time.minutes}m ${time.seconds}s`;
      }

      return `${time.minutes}m ${time.seconds}s`;
    }

    return `${time.days}d ${time.hours}h ${time.minutes}m ${time.seconds}s`;
  }, [compact, isAuctionEndedByStatus, status, time]);

  const urgent =
    !time.isEnded &&
    !isAuctionEndedByStatus &&
    time.days === 0 &&
    time.hours < 1;

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${
        time.isEnded || isAuctionEndedByStatus
          ? "bg-slate-100 text-slate-600"
          : urgent
          ? "bg-red-100 text-red-700"
          : "bg-blue-100 text-blue-700"
      }`}
    >
      {label}
    </span>
  );
}