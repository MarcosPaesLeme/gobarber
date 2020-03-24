import Notificaion from '../schemas/Notification';
import User from '../models/User';

class NotificationController {
  async index(req, res) {
    const checkUserProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!checkUserProvider)
      return res
        .status(401)
        .json({ error: 'Only provider can load notifications' });

    const notifications = await Notificaion.find({
      user: req.userId,
    })
      .sort('-createdAt')
      .limit(20)
      .lean();

    return res.json(notifications);
  }

  async update(req, res) {
    const notification = await Notificaion.findByIdAndUpdate(
      req.params.id,
      {
        read: true,
      },
      {
        new: true,
      }
    );

    return res.json(notification);
  }
}

export default new NotificationController();
