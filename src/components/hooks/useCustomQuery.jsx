import { useQuery } from "@tanstack/react-query"
import { GetService } from "../../Services/Services"

const useCustomQuery=(route,token,...key)=>{
    return useQuery({
        queryKey:[key],
        queryFn:async()=>await GetService(route,token),
        staleTime: 1000 * 60 * 60,
        cacheTime: 1000 * 60 * 60,
        enabled:!!token
    })
};
export default useCustomQuery;