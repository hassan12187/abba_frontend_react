import { useQuery } from "@tanstack/react-query";
import { GetService } from "../../Services/Services";

export const useRoomsQuery=(route,token,page)=>{
    return useQuery({
        queryKey:[`rooms:${page}`],
        queryFn:()=>GetService(route,token),
        enabled:!!token,
        cacheTime: 1000 * 60 * 60,
        staleTime: 1000 * 60 * 60,
    });
};