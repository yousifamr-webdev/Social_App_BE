import { Model, Types, } from "mongoose";
import {} from "mongodb";
import mongodb from "mongodb";
class DBRepo {
    Model;
    constructor(Model) {
        this.Model = Model;
    }
    async create({ data, options }) {
        return await this.Model.create(data, options);
    }
    async findOne({ filter, projection, options, }) {
        return await this.Model.findOne(filter, projection, options);
    }
    async findOneAndUpdate({ filter, update, options, }) {
        return await this.Model.findOneAndUpdate(filter, update, options);
    }
    async find({ filter, projection, options, }) {
        return await this.Model.find(filter, projection, options);
    }
    async updateOne({ filter = {}, update, options, }) {
        return await this.Model.updateOne(filter, { ...update, $inc: { __v: 1 } });
    }
    async findById({ id, projection, options, }) {
        return await this.Model.findById(id, projection, options);
    }
    getDBDoc(data) {
        return new this.Model(data);
    }
    async saveDBDoc(doc) {
        return await doc.save();
    }
    async paginate({ filter, projection, options, page = 1, size = 3, }) {
        const skip = (page - 1) * size;
        const docs = await this.Model.find(filter, projection, options)
            .skip(skip)
            .limit(size);
        const totalDocs = await this.Model.countDocuments(filter);
        return { docs, page, totalDocs, totalPages: Math.ceil(totalDocs / size) };
    }
    async deleteOne({ filter, options, }) {
        return await this.Model.deleteOne(filter, options);
    }
}
export default DBRepo;
