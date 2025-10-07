import { useQuery } from "@tanstack/react-query"
import { GetService } from "../../Services/Services"

const useExpenseQuery=(route,token,pages)=>{
    return useQuery({
        queryKey:[`expense:${pages}`],
        queryFn:()=>GetService(route,token),
        enabled:!!token,
        cacheTime: 1000 * 60 * 60,
        staleTime: 1000 * 60 * 60,
    })
};
export default useExpenseQuery;