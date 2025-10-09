import { useQuery } from "@tanstack/react-query";
import { GetService } from "../../Services/Services";

export const useRoomsQuery=(token,page,query,status)=>{
    return useQuery({
        queryKey:[`rooms:`,`${page}`,query,status],
        queryFn:()=>GetService(`/api/room?page=${page}&limit=10&query=${query}&status=${status}`,token),
        enabled:!!token,
        cacheTime: 1000 * 60 * 60,
        staleTime: 1000 * 60 * 60,
    });
};