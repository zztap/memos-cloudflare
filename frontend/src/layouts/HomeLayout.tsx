import { observer } from "mobx-react-lite";
import { Outlet } from "react-router-dom";
import { HomeSidebar, HomeSidebarDrawer } from "@/components/HomeSidebar";
import MobileHeader from "@/components/MobileHeader";
import useResponsiveWidth from "@/hooks/useResponsiveWidth";
import { cn } from "@/utils";

const HomeLayout = observer(() => {
  const { md } = useResponsiveWidth();

  return (
    // 修改点 1: 使用 flex-row 并在 md 屏幕上水平排列，justify-center 居中
    <section className="@container w-full min-h-full flex flex-col md:flex-row justify-center items-start">
      {!md && (
        <MobileHeader>
          <HomeSidebarDrawer />
        </MobileHeader>
      )}
      
      {/* 修改点 2: 中间内容区域，去掉左右 padding 的硬编码，改为 max-w-2xl 限制宽度 */}
      <div className={cn("w-full max-w-2xl mx-auto px-4 sm:px-6 md:pt-6 pb-8")}>
        <Outlet />
      </div>

      {/* 修改点 3: 右侧边栏使用 sticky 定位，宽度固定 72 (288px)，紧贴中间内容 */}
      {md && (
        <div className={cn("sticky top-0 w-72 shrink-0 h-svh transition-all px-3 py-6")}>
          <HomeSidebar />
        </div>
      )}
    </section>
  );
});

export default HomeLayout;
