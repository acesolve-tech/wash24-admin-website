"use client";
import React, { useEffect } from "react";

const Clock: React.FC = () => {
  useEffect(() => {
    const hour = document.getElementById("clock-hour") as HTMLDivElement,
      minutes = document.getElementById("clock-minutes") as HTMLDivElement,
      seconds = document.getElementById("clock-seconds") as HTMLDivElement,
      textHour = document.getElementById("text-hour") as HTMLDivElement,
      textMinutes = document.getElementById("text-minutes") as HTMLDivElement,
      textSeconds = document.getElementById("text-seconds") as HTMLDivElement,
      textAmPm = document.getElementById("text-ampm") as HTMLDivElement,
      dateDay = document.getElementById("date-day") as HTMLDivElement,
      dateMonth = document.getElementById("date-month") as HTMLDivElement,
      dateYear = document.getElementById("date-year") as HTMLDivElement,
      themeButton = document.getElementById(
        "theme-button"
      ) as HTMLButtonElement;

    const clock = () => {
      let date = new Date();

      let hh = date.getHours() * 30,
        mm = date.getMinutes() * 6,
        ss = date.getSeconds() * 6;

      if (hour) hour.style.transform = `rotateZ(${hh + mm / 12}deg)`;
      if (minutes) minutes.style.transform = `rotateZ(${mm}deg)`;
      if (seconds) seconds.style.transform = `rotateZ(${ss}deg)`;
    };
    setInterval(clock, 1000);

    const clockText = () => {
      let date = new Date();

      let hh = date.getHours(),
        ampm,
        mm = date.getMinutes(),
        ss = date.getSeconds(),
        day = date.getDate(),
        month = date.getMonth(),
        year = date.getFullYear();

      ampm = hh >= 12 ? "PM" : "AM";

      if (textHour) textHour.innerHTML = `${hh < 10 ? "0" : ""}${hh}:`;
      if (textMinutes) textMinutes.innerHTML = `${mm < 10 ? "0" : ""}${mm}:`;
      if (textSeconds) textSeconds.innerHTML = `${ss < 10 ? "0" : ""}${ss}`;
      if (textAmPm) textAmPm.innerHTML = ampm;

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

      if (dateDay) dateDay.innerHTML = day.toString();
      if (dateMonth) dateMonth.innerHTML = ` ${months[month]}, `;
      if (dateYear) dateYear.innerHTML = year.toString();
    };
    setInterval(clockText, 1000);

    const getCurrentTheme = () =>
      document.body.classList.contains("dark-theme") ? "dark" : "light";
    const getCurrentIcon = () =>
      themeButton?.classList.contains("bxs-moon") ? "bxs-moon" : "bxs-sun";

    const selectedTheme = localStorage.getItem("selected-theme");
    const selectedIcon = localStorage.getItem("selected-icon");

    if (selectedTheme) {
      document.body.classList[selectedTheme === "dark" ? "add" : "remove"](
        "dark-theme"
      );
      themeButton?.classList[selectedIcon === "bxs-moon" ? "add" : "remove"](
        "bxs-moon"
      );
    }

    themeButton?.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");
      themeButton?.classList.toggle("bxs-moon");
      localStorage.setItem("selected-theme", getCurrentTheme());
      localStorage.setItem("selected-icon", getCurrentIcon());
    });
  }, []);

  // Get today's date for initial render defaults
  const now = new Date();
  const defaultHour = now.getHours().toString().padStart(2, "0");
  const defaultMinute = now.getMinutes().toString().padStart(2, "0");
  const defaultSecond = now.getSeconds().toString().padStart(2, "0");
  const defaultAmPm = now.getHours() >= 12 ? "PM" : "AM";
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
            <div className="clock__hour" id="clock-hour"></div>
            <div className="clock__minutes" id="clock-minutes"></div>
            <div className="clock__seconds" id="clock-seconds"></div>

            <div className="clock__theme">
              <i className="bx bxs-moon" id="theme-button"></i>
            </div>
          </div>

          <div>
            <div className="clock__text">
              <div id="text-hour">{defaultHour}:</div>
              <div id="text-minutes">{defaultMinute}:</div>
              <div id="text-seconds">{defaultSecond}</div>
              <div id="text-ampm">{defaultAmPm}</div>
            </div>

            <div className="clock__date">
              <span id="date-day">{now.getDate()}</span>
              <span id="date-month"> {months[now.getMonth()]}, </span>
              <span id="date-year">{now.getFullYear()}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Clock;
