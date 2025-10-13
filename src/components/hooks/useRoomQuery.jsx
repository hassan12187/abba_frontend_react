import { useQuery } from "@tanstack/react-query";
import { GetService } from "../../Services/Services";

export const useRoomsQuery=(token,page,query,status)=>{
    return useQuery({
        queryKey:[`rooms`,`${page}`,query,status],
        queryFn:()=>GetService(`/api/admin/room?page=${page}&limit=10&query=${query}&status=${status}`,token),
        enabled:!!token,
        cacheTime: 1000 * 60 * 60,
        staleTime: 1000 * 60 * 60,
    });
};
export const useBlockRoomsQuery=(block,token)=>{
    return useQuery({
        queryKey:[`block_with_rooms`,block],
        queryFn:async()=>await GetService(`/api/admin/room/block?&block=${block}`,token),
        enabled:!!block,
        cacheTime:1000*60*60,
        staleTime:1000*60*60
    });
};