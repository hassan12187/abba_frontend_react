import { useQuery } from "@tanstack/react-query"
import { GetService } from "../../Services/Services"

const useExpenseQuery=(page,token,q,date)=>{
    const queryParams=new URLSearchParams({
        page,
        limit:10
    });
    if(q)queryParams.append("query",q);
    if(date)queryParams.append('date',date);
    return useQuery({
        queryKey:[`expense`,`${page}`,q,date||'no-date'],
        queryFn:()=>GetService(`/api/admin/expense?${queryParams.toString()}`,token),
        enabled:!!token,
        cacheTime: 1000 * 60 * 60,
        staleTime: 1000 * 60 * 60,
    })
};
export default useExpenseQuery;