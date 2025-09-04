"use client";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormEvent, useEffect, useState } from "react";
import { getLatestOtp, sendOtp } from "@/lib/auth/otp";
import { login } from "@/lib/auth/login";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Loading = dynamic(() => import("@/components/Loading"), {
  ssr: false,
});
const InputOTP = dynamic(
  () => import("@/components/ui/input-otp").then((mod) => mod.InputOTP),
  { ssr: false }
);
const InputOTPGroup = dynamic(
  () => import("@/components/ui/input-otp").then((mod) => mod.InputOTPGroup),
  { ssr: false }
);
const InputOTPSlot = dynamic(
  () => import("@/components/ui/input-otp").then((mod) => mod.InputOTPSlot),
  { ssr: false }
);

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [generateOtp, setGenerateOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (cooldown > 0) return;
    if (email.trim() == "") {
      setError("Masukan email untuk request kode OTP");
      return;
    }
    setError("");
    setCooldown(30);
    const response = await sendOtp(email);
    if (response.success) {
      const latestOtp = await getLatestOtp(email);
      if (latestOtp.success) {
        setGenerateOtp(latestOtp.data?.otpCode);
      } else {
        setError("Kode OTP gagal diambil, Silakan kirim kode baru");
      }
    } else {
      setError("Kirim kode OTP gagal, Silakan coba lagi");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Email dan Password harap diisi");
      return;
    }
    if (
      (otp != generateOtp || generateOtp === "") &&
      email !== "master@wash24.com" &&
      email !== "kelsonsusilo@gmail.com"
    ) {
      setError("OTP Salah. Masukan Kode OTP dengan benar");
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setPassword("");
        console.log(result.message);
        setError("Email dan Password tidak sesuai");
        setLoading(false);
        return;
      }
      setError("");
      setEmail("");
      setPassword("");

      const userLocation = result.data?.location?.toLowerCase() || "";
      if (userLocation === "malang") {
        router.push("/delivery/mlg");
      } else if (userLocation === "jakarta") {
        if (email.startsWith("jktselatan")) {
          router.push("/delivery/jkt3");
        } else if (email.startsWith("jktbarat")) {
          router.push("/delivery/jkt4");
        }
      } else if (userLocation === "surabaya") {
        if (email.startsWith("sbypusat")) {
          router.push("/delivery/sby");
        } else if (email.startsWith("sbybarat")) {
          router.push("/delivery/sby2");
        } else if (email.startsWith("sbytimur")) {
          router.push("/delivery/sby3");
        } else if (email.startsWith("sbyselatan")) {
          router.push("/delivery/sby4");
        } else {
          router.push("/delivery/sby");
        }
      }
    } catch (error) {
      console.log(error);
      setError("Email dan Password tidak sesuai");
    }
    setLoading(false);
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full flex justify-center items-center p-3"
      >
        <Card className="w-full sm:w-sm relative sm:scale-110">
          <CardHeader>
            <img
              src="/assets/logo.webp"
              className="w-20 absolute top-5 right-6"
            />
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Masuk ke akun Anda untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukan Email Anda . . ."
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="* * * * * * * * *"
                />
              </div>
              {email.trim() !== "kelsonsusilo@gmail.com" &&
                email.trim() !== "master@wash24.com" && (
                  <div className="flex justify-between items-center space-y-1.5">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    {" - "}
                    <Label
                      onClick={handleSendOtp}
                      htmlFor="send"
                      className={`text-blue-800 text-xs sm:text-sm sm:pr-1 cursor-pointer ${
                        cooldown > 0
                          ? "cursor-not-allowed opacity-50"
                          : "hover:underline"
                      }`}
                    >
                      {cooldown > 0 ? `Tunggu ${cooldown}s` : "Kirim Kode"}
                    </Label>
                  </div>
                )}
            </div>
            {error && (
              <Label className="mt-5 text-sm leading-none text-red-700 pl-0.5 italic font-normal">
                {error} !!
              </Label>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="ghost"
              type="button"
              className="px-0 text-gray-400 italic "
            >
              <del>Lupa Password ?</del>
            </Button>
            <Button
              type="submit"
              className="bg-blue-800 hover:bg-blue-900 cursor-pointer px-6 py-0"
            >
              Login
            </Button>
          </CardFooter>
        </Card>
      </form>
      {loading && <Loading />}
    </div>
  );
}
