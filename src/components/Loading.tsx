import React from "react";
import Lottie from "lottie-react";
import defaultAnimation from "@/../public/assets/animation/loadingAnimation.json";

interface LoadingProps {
  animationData?: any;
}

const Loading: React.FC<LoadingProps> = ({
  animationData = defaultAnimation,
}) => {
  return (
    <div className="fixed w-screen h-screen top-0 left-0 flex justify-center items-center bg-black/50 z-10">
      <Lottie className="size-80" animationData={animationData} loop={true} />
    </div>
  );
};

export default Loading;
