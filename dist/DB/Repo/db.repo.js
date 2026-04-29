import { Model, Types, } from "mongoose";
class DBRepo {
    Model;
    constructor(Model) {
        this.Model = Model;
    }
    async create({ data, options, }) {
        return await this.Model.create(data, options);
    }
    async findOne({ filter, projection, options, }) {
        return await this.Model.findOne(filter, projection, options);
    }
    async updateOne({ model, filter = {}, update, options, }) {
        return await model.updateOne(filter, { ...update, $inc: { __v: 1 } });
    }
    async findById({ id, projection, options, }) {
        return await this.Model.findById(id, projection, options);
    }
}
export default DBRepo;
