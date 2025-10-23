import { useQuery } from "@tanstack/react-query"
import { GetService } from "../../Services/Services"

const useCustomQuery=(route,token,queryKey)=>{
    return useQuery({
        queryKey:[queryKey],
        queryFn:async()=>await GetService(route,token),
        staleTime: 1000 * 60 * 60,
        cacheTime: 1000 * 60 * 60,
        enabled:!!token
    })
};
export default useCustomQuery;