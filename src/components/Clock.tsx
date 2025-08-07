"use client";
import React, { useEffect, useRef } from "react";

const Clock: React.FC = () => {
  const hourRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);
  const secondsRef = useRef<HTMLDivElement>(null);

  const textHourRef = useRef<HTMLDivElement>(null);
  const textMinutesRef = useRef<HTMLDivElement>(null);
  const textSecondsRef = useRef<HTMLDivElement>(null);
  const textAmPmRef = useRef<HTMLDivElement>(null);

  const dateDayRef = useRef<HTMLSpanElement>(null);
  const dateMonthRef = useRef<HTMLSpanElement>(null);
  const dateYearRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hh = now.getHours();
      const mm = now.getMinutes();
      const ss = now.getSeconds();

      if (hourRef.current)
        hourRef.current.style.transform = `rotateZ(${
          (hh % 12) * 30 + mm * 0.5
        }deg)`;
      if (minutesRef.current)
        minutesRef.current.style.transform = `rotateZ(${mm * 6}deg)`;
      if (secondsRef.current)
        secondsRef.current.style.transform = `rotateZ(${ss * 6}deg)`;

      if (textHourRef.current)
        textHourRef.current.innerText = `${hh.toString().padStart(2, "0")}:`;
      if (textMinutesRef.current)
        textMinutesRef.current.innerText = `${mm.toString().padStart(2, "0")}:`;
      if (textSecondsRef.current)
        textSecondsRef.current.innerText = ss.toString().padStart(2, "0") + "";
      if (textAmPmRef.current)
        textAmPmRef.current.innerText = hh >= 12 ? "PM" : "AM";

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      if (dateDayRef.current)
        dateDayRef.current.innerText = now.getDate().toString();
      if (dateMonthRef.current)
        dateMonthRef.current.innerText = ` ${months[now.getMonth()]}, `;
      if (dateYearRef.current)
        dateYearRef.current.innerText = now.getFullYear().toString();
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>
        {` 
            
          .clock__circle {
            position: relative;
            width: 160px;
            height: 160px;
            border-radius: 50%;
            box-shadow: -6px -6px 16px white,
                        6px 6px 16px rgba(0, 0, 0, 0.1),
                        inset 6px 6px 16px rgba(0, 0, 0, 0.1),
                        inset -6px -6px 16px white;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: 0.4s;
            margin: auto;
          }

          .clock__twelve,
          .clock__three,
          .clock__six,
          .clock__nine {
            position: absolute;
            width: 1rem;
            height: 1px;
            background-color: #999;
          }

          .clock__twelve, .clock__six {
            left: 50%;
            transform: translateX(-50%) rotate(90deg);
          }

          .clock__twelve { top: 1.25rem; }
          .clock__three { top: 50%; right: 0.75rem; }
          .clock__six { bottom: 1.25rem; }
          .clock__nine { top: 50%; left: 0.75rem; }

          .clock__rounder {
            width: 12px;
            height: 12px;
            background-color: #007bff;
            border-radius: 50%;
            border: 2px solid #f1f1f1;
            z-index: 10;
          }

          .clock__hour, .clock__minutes, .clock__seconds {
            position: absolute;
            display: flex;
            justify-content: center;
          }

          .clock__hour { width: 105px; height: 105px; }
          .clock__hour::before {
            content: "";
            position: absolute;
            width: 4px;
            height: 48px;
            background-color: #333;
            border-radius: 6px;
          }

          .clock__minutes { width: 136px; height: 136px; }
          .clock__minutes::before {
            content: "";
            position: absolute;
            width: 4px;
            height: 64px;
            background-color: #333;
            border-radius: 6px;
          }

          .clock__seconds { width: 130px; height: 130px; }
          .clock__seconds::before {
            content: "";
            position: absolute;
            width: 2px;
            height: 80px;
            background-color: #303094;
            border-radius: 6px;
          }

          .clock__text {
            display: flex;
            justify-content: center;
            gap: 4px;
            font-size: 1.7rem;
            color: #333;
            font-weight: bold;
          }

          .clock__date {
            text-align: center;
            color: #555;
            font-weight: 500;
          }

          .dark-theme {
            background-color: #111;
            color: #eee;
          }
        `}
      </style>

      <div className="clock__container grid">
        <div className="clock__content grid gap-3">
          <div className="clock__circle">
            <span className="clock__twelve"></span>
            <span className="clock__three"></span>
            <span className="clock__six"></span>
            <span className="clock__nine"></span>

            <div className="clock__rounder"></div>
            <div className="clock__hour" ref={hourRef}></div>
            <div className="clock__minutes" ref={minutesRef}></div>
            <div className="clock__seconds" ref={secondsRef}></div>

            {/* Optional: Remove theme toggle from here */}
          </div>

          <div>
            <div className="clock__text">
              <div ref={textHourRef}>00:</div>
              <div ref={textMinutesRef}>00:</div>
              <div ref={textSecondsRef}>00</div>
              <div ref={textAmPmRef}>AM</div>
            </div>

            <div className="clock__date">
              <span ref={dateDayRef}>00</span>
              <span ref={dateMonthRef}> Jan, </span>
              <span ref={dateYearRef}>0000</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Clock;
