import { useSelector } from "react-redux";

const Navbar = ({ title }) => {
  const { userInfo } = useSelector((state) => state.auth);

  return (
    <div className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between border-b border-stone-200 bg-white/95 px-4 py-3 pl-16 shadow-sm backdrop-blur md:px-5">
      <h2 className="text-2xl text-stone-800">{title}</h2>
      <span className="hidden rounded-full border border-stone-200 bg-white px-4 py-2 text-xs text-stone-600 sm:block">
        Welcome,{" "}
        <span className="font-semibold text-stone-800">
          {userInfo?.user?.name}
        </span>
      </span>
    </div>
  );
};

export default Navbar;
