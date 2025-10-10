import { useQuery } from "@tanstack/react-query"
import { GetService } from "../../Services/Services"

const useBlockQuery=(token)=>{
    return useQuery({
        queryKey:["block"],
        queryFn:async()=>await GetService(`/api/block`,token),
        staleTime: 1000 * 60 * 60,
        cacheTime: 1000 * 60 * 60,
        enabled:!!token
    })
};
export default useBlockQuery;