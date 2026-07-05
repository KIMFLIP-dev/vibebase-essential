export const Logo = () => {
  return (
    <div className="w-8 h-8 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        className="w-8 h-8"
      >
        <defs>
          <linearGradient
            id="symVibeGradientSimple"
            x1="20%"
            y1="20%"
            x2="80%"
            y2="80%"
          >
            <stop offset="0%" style={{ stopColor: "#8B5CF6", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#2DD4BF", stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <path
          d="M 100,20
             C 115,20 130,60 150,70
             C 170,80 180,90 180,100
             C 180,110 170,120 150,130
             C 130,140 115,180 100,180
             C 85,180 70,140 50,130
             C 30,120 20,110 20,100
             C 20,90 30,80 50,70
             C 70,60 85,20 100,20 Z"
          fill="url(#symVibeGradientSimple)"
        />
      </svg>
    </div>
  );
};
