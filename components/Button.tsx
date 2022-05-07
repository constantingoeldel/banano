export const FullButton = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-md ">
    <a
      href="#"
      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-dark bg-banano-600 hover:bg-banano-700 md:py-4 md:text-lg md:px-10"
    >
      {children}
    </a>
  </div>
);
export const BorderButton = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-md">
    <a
      href="#"
      className="w-full flex items-center justify-center px-8 py-3 border-2 border-dark text-base font-medium rounded-md text-banano-700  md:py-4 md:text-lg md:px-10"
    >
      {children}
    </a>
  </div>
);
