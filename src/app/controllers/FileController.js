import File from '../models/File';

class FileController {
  async store(req, res) {
    const { originalname: name, filename: path } = req.file;

    const file = await File.create({
      name,
      path,
    });

    return res.json({ file });
  }

  async find(req, res) {
    const { filename } = req.params;

    const file = await File.findOne({
      where: { path: filename },
    });

    return res.json({ file });
  }
}

export default new FileController();
