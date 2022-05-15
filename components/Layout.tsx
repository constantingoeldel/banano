import Image from "next/image";
import Link from "next/link";
import { Popover, Transition } from "@headlessui/react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";
import { Fragment } from "react";
import { ChainToggle } from "./Toggle";
import Script from "next/script";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-white overflow-hidden text-dark break-words">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20  lg:w-full lg:pb-28 xl:pb-32">
          {/* <svg
            className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
            fill="currentColor"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon points="50,0 100,0 50,100 0,100" />
          </svg> */}

          <Popover>
            <div className="relative pt-6 px-4 sm:px-6 lg:px-8 ">
              <div className="absolute -ml-10  md:hidden ">
                <Link passHref href="/">
                  <div className="">
                    <Image src="/banano-small.svg" alt="Banano logo" height={50} width={400} />
                  </div>
                </Link>
              </div>
              <nav
                className="relative flex items-center justify-between sm:h-10 lg:justify-start"
                aria-label="Global"
              >
                <div className="flex items-center flex-grow flex-shrink-0 lg:flex-grow-0">
                  <div className="flex items-center justify-between w-full md:w-auto">
                    <a href="#">
                      <span className="sr-only">Workflow</span>
                    </a>
                    <div className="-mr-2 flex items-center md:hidden">
                      <Popover.Button className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-banano-500">
                        <span className="sr-only">Open main menu</span>
                        <MenuIcon className="h-6 w-6" aria-hidden="true" />
                      </Popover.Button>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block md:ml-10 md:pr-4 md:space-x-8 w-full">
                  <header className="flex justify-between">
                    <Link passHref href="/">
                      <div className="-ml-20 -mb-5">
                        <Image src="/banano.svg" alt="Banano logo" height={50} width={400} />
                      </div>
                    </Link>
                    <div className="mt-5 flex">
                      {/* <Link href="/">Purchase BAN</Link>

             <Link href="/test">Test payment</Link> */}
                      <Link href={"/source"}>
                        <a className=" ">Offer your own</a>
                      </Link>
                      <div className="mr-5"></div>
                      <Link href={"/dashboard"}>
                        <a className=" ">To my dashboard</a>
                      </Link>
                      {/* <label className="hidden">Do you want to use USD or EUR?</label>
                      <select
                        onChange={(e) => useStore.setState({ currency: e.target.value })}
                        className="ml-4 -m-2"
                        value={currency}
                        name="currency"
                        id="currency"
                      >
                        <option value="eur">EUR</option>
                        <option value="usd">USD</option>
                      </select> */}
                      <ChainToggle />
                    </div>
                  </header>
                </div>
              </nav>
            </div>

            <Transition
              as={Fragment}
              enter="duration-150 ease-out"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="duration-100 ease-in"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Popover.Panel
                focus
                className="absolute z-10 top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden"
              >
                <div className="rounded-lg shadow-md bg-white ring-1 ring-black ring-opacity-5 overflow-hidden">
                  <div className="px-5 pt-4 flex items-center justify-between">
                    <div></div>
                    <div className="-mr-2">
                      <Popover.Button className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-banano-500">
                        <span className="sr-only">Close main menu</span>
                        <XIcon className="h-6 w-6" aria-hidden="true" />
                      </Popover.Button>
                    </div>
                  </div>
                  <div className="px-2 pt-2 pb-3 space-y-1">
                    <header className="flex flex-col items-center justify-center">
                      {/* <Link href="/">Purchase BAN</Link>

             <Link href="/test">Test payment</Link> */}
                      <Link href={"/source"}>Offer your own</Link>
                      <Link href={"/dashboard"}>To my dashboard</Link>
                      <div className="py-5"></div>
                      <ChainToggle />
                      <div className="py-5"></div>
                    </header>
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </Popover>
          <main className="text-lg text-dark mt-10 md:grid mx-auto max-w-4xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            {children}
          </main>
          <footer className="mt-10 mx-auto max-w-4xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <Link href="/imprint">Imprint | </Link>
            <Link href="/privacy">Privacy | </Link>
            <Link href="/agb">Terms </Link>
          </footer>
          <Script
            src="//code.tidio.co/zuigqjgj3hkww91lrmecg50kquvy0vjo.js"
            strategy="afterInteractive"
          />
        </div>
      </div>
    </div>
  );
}

// function LoginButtons() {
//   const { data: session } = useSession();
//   if (session) {
//     return (
//       <>
//         <Link href={"/dashboard/" + session.user.id}>Dashboard</Link>
//         <button onClick={() => signOut()}>Sign out</button>
//       </>
//     );
//   }
//   return (
//     <>
//       <button onClick={() => signIn()}>Sign in</button>
//     </>
//   );
// }
