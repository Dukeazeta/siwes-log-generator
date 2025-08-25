export const LumaSpin = () => {
  return (
    <div className="relative w-[80px] h-[80px] flex items-center justify-center">
      <span className="absolute rounded-[50px] animate-loaderAnim shadow-[inset_0_0_0_4px] shadow-gray-800 dark:shadow-gray-100" />
      <span className="absolute rounded-[50px] animate-loaderAnim animation-delay shadow-[inset_0_0_0_4px] shadow-gray-800 dark:shadow-gray-100" />
      <style jsx>{`
        @keyframes loaderAnim {
          0% {
            inset: 0 40px 0;
          }
          12.5% {
            inset: 0 40px 0 0;
          }
          25% {
            inset: 40px 0 0;
          }
          37.5% {
            inset: 40px 0 0;
          }
          50% {
            inset: 40px 0 0 40px;
          }
          62.5% {
            inset: 0 0 0 40px;
          }
          75% {
            inset: 0 0 40px 40px;
          }
          87.5% {
            inset: 0 0 40px 0;
          }
          100% {
            inset: 0 40px 40px 0;
          }
        }
        .animate-loaderAnim {
          animation: loaderAnim 2.5s infinite;
        }
        .animation-delay {
          animation-delay: -1.25s;
        }
      `}</style>
    </div>
  );
};