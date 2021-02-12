import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { PaginatedResult } from '../_models/pagination';

/**
 * method to get results for paginating lists
 * @param url the api url
 * @param params include the pagination headers that help determine what to display on the page
 */
export function getPaginatedResult<T>(url, params: HttpParams, http: HttpClient) {
    const paginatedResult: PaginatedResult<T> = new PaginatedResult<T>();
    return http.get<T>(url, { observe: 'response', params }).pipe(
        map(response => {
        paginatedResult.result = response.body;
        if (response.headers.get('Pagination') !== null) {
            paginatedResult.pagination = JSON.parse(response.headers.get('Pagination'));
        }
        return paginatedResult;
        })
    );
}

/**
 * method that appends pagenumber and pageSize to the Http Params
 * @param pageNumber Current page number the user is on for pagination
 * @param pageSize total number of pages
 */
export function getPaginationHeaders(pageNumber: number, pageSize: number) {
    // this helps serialize our parameters
    let params = new HttpParams();

    params = params.append('pageNumber', pageNumber.toString());
    params = params.append('pageSize', pageSize.toString());

    return params;
}
