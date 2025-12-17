import { observer } from "mobx-react-lite";
import { Outlet } from "react-router-dom";
import { HomeSidebar, HomeSidebarDrawer } from "@/components/HomeSidebar";
import MobileHeader from "@/components/MobileHeader";
import useResponsiveWidth from "@/hooks/useResponsiveWidth";
import { cn } from "@/utils";

const HomeLayout = observer(() => {
  const { md } = useResponsiveWidth();

  return (
    <section className="@container w-full min-h-full flex flex-col md:flex-row justify-center items-start">
      {!md && (
        <MobileHeader>
          <HomeSidebarDrawer />
        </MobileHeader>
      )}
      
      <div className={cn("w-full max-w-2xl mx-auto px-4 sm:px-6 md:pt-6 pb-8")}>
        <Outlet />
      </div>

      {md && (
        <div className={cn("sticky top-0 w-72 shrink-0 h-svh transition-all px-3 py-6")}>
          <HomeSidebar />
        </div>
      )}
    </section>
  );
});

export default HomeLayout;
