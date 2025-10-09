import { useQuery } from "@tanstack/react-query"
import { GetService } from "../../Services/Services"

const useBlockQuery=(block,modal,token)=>{
    if(!block)return {data:null};
    return useQuery({
        queryKey:["block",block,modal],
        queryFn:async()=>await GetService(`/api/block?block=${block}`,token),
        staleTime: 1000 * 60 * 60,
        cacheTime: 1000 * 60 * 60,
        enabled:!!token
    })
};
export default useBlockQuery;