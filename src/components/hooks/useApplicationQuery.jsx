import { useQuery } from "@tanstack/react-query"
import { GetService } from "../../Services/Services"

const useApplicationQuery=(page,q,token)=>{
    return useQuery({
        queryKey:[`application`,`${page}`,q],
        queryFn:()=>GetService(`/api/student/application?page=${page}&limit=${10}&query=${q}`,token),
        staleTime: 1000 * 60 * 60,
        cacheTime: 1000 * 60 * 60,
        enabled:!!token
    })
};
export default useApplicationQuery;