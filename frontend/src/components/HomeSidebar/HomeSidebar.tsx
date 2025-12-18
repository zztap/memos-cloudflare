import { last } from "lodash-es";
import { observer } from "mobx-react-lite";
import { matchPath, useLocation } from "react-router-dom";
import useDebounce from "react-use/lib/useDebounce";
import SearchBar from "@/components/SearchBar";
import useCurrentUser from "@/hooks/useCurrentUser";
import { Routes } from "@/router";
import { memoStore, userStore } from "@/store/v2";
import { cn } from "@/utils";
import MemoFilters from "../MemoFilters";
import StatisticsView from "../StatisticsView";
import ShortcutsSection from "./ShortcutsSection";
import TagsSection from "./TagsSection";

interface Props {
  className?: string;
}

const HomeSidebar = observer((props: Props) => {
  const location = useLocation();
  const currentUser = useCurrentUser();

  // --- 修改开始 ---
  useDebounce(
    async () => {
      let parent: string | undefined = undefined;
      // 1. 如果在主页且已登录
      if (location.pathname === Routes.ROOT && currentUser) {
        parent = currentUser.name;
      }
      // 2. 如果在用户详情页
      else if (matchPath("/u/:username", location.pathname) !== null) {
        const username = last(location.pathname.split("/"));
        const user = await userStore.getOrFetchUserByUsername(username || "");
        parent = user.name;
      }
      // 3. 👇 新增：如果在发现页（Explore），强制使用 admin 用户的数据（或者任何有效用户）来显示标签
      else if (location.pathname === Routes.EXPLORE) {
         parent = 'users/1'; 
      }
      
      // 只有 parent 有值的时候才加载数据
      if (parent) {
        await userStore.fetchUserStats(parent);
      }
    },
    300,
    [memoStore.state.memos.length, userStore.state.statsStateId, location.pathname],
  );
  // --- 修改结束 ---

  return (
    <aside className={cn("relative w-full h-full overflow-auto flex flex-col justify-start items-start", props.className)}>
      <SearchBar />
      <div className="mt-1 px-1 w-full">
        <StatisticsView />
        <MemoFilters />
        {currentUser && <ShortcutsSection />}
        <TagsSection />
      </div>
    </aside>
  );
});

export default HomeSidebar;
