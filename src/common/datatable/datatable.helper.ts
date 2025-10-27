import { SelectQueryBuilder } from 'typeorm';

export class DataTableHelper {
    static async applyPagination<T>(
        qb: SelectQueryBuilder<T>,
        query: {
          limit?: number;
          cursor?: string | number;
          orderBy?: string | string[][]; // Allow multiple sorting columns
          filters?: string | Record<string, any>;
          search?: string | number;
          searchFields?: string[] | string;
        }
      ) {
        console.log("Received Query Params: ", query);
      
        const limit = query.limit || 10;
      
        // ✅ Parse Filters
        let parsedFilters: Record<string, any> = {};
        if (query.filters) {
          try {
            parsedFilters =
              typeof query.filters === "string"
                ? JSON.parse(decodeURIComponent(query.filters))
                : query.filters;
          } catch (error) {
            console.error("Invalid filters format:", error);
            parsedFilters = {};
          }
        }
      
        // ✅ Parse Search Fields
        let parsedSearchFields: string[] = [];
        if (typeof query.searchFields === "string") {
          try {
            parsedSearchFields = JSON.parse(query.searchFields);
          } catch (error) {
            console.error("Failed to parse searchFields:", error);
            parsedSearchFields = [query.searchFields];
          }
        } else if (Array.isArray(query.searchFields)) {
          parsedSearchFields = query.searchFields;
        }
      
        console.log("Final searchFields array:", parsedSearchFields);
      
        // ✅ Parse Multiple OrderBy Fields
        let parsedOrderBy: [string, "ASC" | "DESC"][] = [];
        if (typeof query.orderBy === "string") {
          try {
            parsedOrderBy = JSON.parse(query.orderBy);
          } catch (error) {
            console.error("Failed to parse orderBy:", error);
            parsedOrderBy = [];
          }
        } 
        else if (Array.isArray(query.orderBy) && query.orderBy.every(item => Array.isArray(item) && item.length === 2)) {
            parsedOrderBy = query.orderBy as [string, "ASC" | "DESC"][];
        }
      
        console.log("Final orderBy array:", parsedOrderBy);
      
        // 🎯 **Fetch Column Metadata**
        const entityMetadata = qb.connection.getMetadata(qb.alias);
        const numericColumns = entityMetadata.columns
          .filter(col =>
            ["int", "bigint", "smallint", "decimal", "numeric", "integer"].includes(
              col.type as string
            )
          )
          .map(col => col.propertyName);
      
        console.log("Detected Numeric Columns: ", numericColumns);
      
        // 🎯 **Apply Search Dynamically**
        if (query.search && parsedSearchFields.length > 0) {
          const searchConditions = parsedSearchFields
            .map(field => {
              if (numericColumns.includes(field)) {
                return `${qb.alias}.${field} = :search`; // Use '=' for numeric fields
              }
              return `${qb.alias}.${field}::TEXT ILIKE :search`; // Convert to TEXT before applying ILIKE
            })
            .join(" OR ");
      
          const isNumericSearch = !isNaN(Number(query.search));
      
          qb.andWhere(`(${searchConditions})`, {
            search: isNumericSearch ? Number(query.search) : `%${query.search}%`,
          });
        }
      
        // 🎯 **Apply Filters**
        Object.keys(parsedFilters).forEach(field => {
          qb.andWhere(`${qb.alias}.${field} = :${field}`, {
            [field]: parsedFilters[field],
          });
        });
      
        // 🎯 **Apply Multiple Sorting Fields**
        if (parsedOrderBy.length > 0) {
          parsedOrderBy.forEach(([column, direction]) => {
            qb.addOrderBy(`${qb.alias}.${column}`, direction);
          });
        } else {
          // Default sorting if none provided
          qb.orderBy(`${qb.alias}.created_at`, "DESC");
        }
      
        qb.take(limit);
      
        const data = await qb.getMany();
        const nextCursor = data.length ? data[data.length - 1][parsedOrderBy[0]?.[0] || "created_at"] : null;
      
        return { data, nextCursor };
      }
         
}
