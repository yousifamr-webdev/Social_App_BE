import {
  Model,
  Types,
  type CreateOptions,
  type ProjectionType,
  type QueryFilter,
  type QueryOptions,
  type UpdateQuery,
} from "mongoose";
import { type UpdateOptions } from "mongodb";

abstract class DBRepo<T> {
  constructor(protected Model: Model<T>) {}

  public async create({
    data,
    options,
  }: {
    data: any;
    options?: CreateOptions;
  }) {
    return await this.Model.create(data, options);
  }

  public async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<T>;
    projection?: ProjectionType<T> | null | undefined;
    options?: QueryOptions<T>;
  }) {
    return await this.Model.findOne(filter, projection, options);
  }

  public async updateOne({
    filter = {},
    update,
    options,
  }: {
    filter: QueryFilter<T>;
    update: UpdateQuery<T>;
    options?: UpdateOptions;
  }) {
    return await this.Model.updateOne(filter, { ...update, $inc: { __v: 1 } });
  }

  public async findById({
    id,
    projection,
    options,
  }: {
    id: string | Types.ObjectId;
    projection?: ProjectionType<T> | null | undefined;
    options?: QueryOptions<T>;
  }) {
    return await this.Model.findById(id, projection, options);
  }
}

export default DBRepo;
