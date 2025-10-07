import {useQuery} from "@tanstack/react-query"
import { GetService } from "../../Services/Services"

const useNotificationQuery=(route,token)=>{
    return useQuery({
        queryKey:["notification"],
        queryFn:()=>GetService(route,token),
        staleTime:1000 * 60 * 60,
        cacheTime:1000 * 60 * 60,
        enabled:!!token
    });
};
export default useNotificationQuery;