import { useQuery } from "@tanstack/react-query"
import { GetService } from "../../Services/Services"

const useApplicationQuery=(route,token,page)=>{
    return useQuery({
        queryKey:[`application:${page}`],
        queryFn:()=>GetService(route,token),
        staleTime: 1000 * 60 * 60,
        cacheTime: 1000 * 60 * 60,
        enabled:!!token
    })
};
export default useApplicationQuery;