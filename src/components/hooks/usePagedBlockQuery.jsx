import { useQuery } from "@tanstack/react-query"
import { GetService } from "../../Services/Services"

const usePagedBlockQuery=(token,page,block,status)=>{
    return useQuery({
        queryKey:["block_page",page,block,status],
        queryFn:async()=>await GetService(`/api/block/query?page=${page}&limit=10&block=${block}&status=${status}`,token),
        staleTime: 1000 * 60 * 60,
        cacheTime: 1000 * 60 * 60,
        enabled:!!token
    })
};
export default usePagedBlockQuery;