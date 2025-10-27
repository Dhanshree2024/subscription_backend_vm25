import { DataSource, EntityTarget, Repository } from 'typeorm';
 
export async function getTenantRepository<T>(
  dataSource: DataSource,
  entity: EntityTarget<T>,
  schema: string,
): Promise<Repository<T>> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.query(`SET search_path TO ${schema}, public`);
 
  return queryRunner.manager.getRepository(entity);
}
 