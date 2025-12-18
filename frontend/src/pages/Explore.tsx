import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { HomeSidebar } from "@/components/HomeSidebar";
import MemoView from "@/components/MemoView";
import MobileHeader from "@/components/MobileHeader";
import PagedMemoList from "@/components/PagedMemoList";
import useResponsiveWidth from "@/hooks/useResponsiveWidth";
import { cn } from "@/utils";
import { viewStore } from "@/store/v2";
import { Direction, State } from "@/types/proto/api/v1/common";
import { Memo } from "@/types/proto/api/v1/memo_service";

const Explore = observer(() => {
  const { md } = useResponsiveWidth();

  return (
    <section className="@container w-full min-h-full flex flex-col md:flex-row justify-center items-start">
      {!md && <MobileHeader />}

      <div className={cn("w-full max-w-2xl px-4 sm:px-6 md:pt-6 pb-8")}>
        <PagedMemoList
          renderer={(memo: Memo) => <MemoView key={`${memo.name}-${memo.updateTime}`} memo={memo} showCreator showVisibility compact />}
          owner="users/1"
          filter="visibility == 'PUBLIC'"
          listSort={(memos: Memo[]) =>
            memos
              .filter((memo) => memo.state === State.NORMAL)
              .sort((a, b) =>
                viewStore.state.orderByTimeAsc
                  ? dayjs(a.displayTime).unix() - dayjs(b.displayTime).unix()
                  : dayjs(b.displayTime).unix() - dayjs(a.displayTime).unix(),
              )
          }
          direction={viewStore.state.orderByTimeAsc ? Direction.ASC : Direction.DESC}
        />
      </div>

      {md && (
        <div className={cn("sticky top-0 w-72 shrink-0 h-svh transition-all px-3 py-6")}>
          <HomeSidebar />
        </div>
      )}
    </section>
  );
});

export default Explore;
