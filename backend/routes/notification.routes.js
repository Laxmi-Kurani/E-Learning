// Notifications Routes - User notifications

const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { HTTP_STATUS } = require('../utils/constants');
const { getPaginationParams } = require('../utils/helpers');

// Get user notifications
router.get('/', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const { limit, offset } = getPaginationParams(req.query);
    const unreadOnly = req.query.unreadOnly === 'true';
    
    let query = 'SELECT COUNT(*) as count FROM notification WHERE user_id = ?';
    let countParams = [req.userId];
    
    let dataQuery = `SELECT * FROM notification WHERE user_id = ?`;
    let dataParams = [req.userId];
    
    if (unreadOnly) {
      query += ' AND is_read = false';
      dataQuery += ' AND is_read = false';
      countParams = [req.userId];
      dataParams = [req.userId];
    }
    
    const [total] = await db.query(query, countParams);
    const [notifications] = await db.query(
      `${dataQuery} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...dataParams, limit, offset]
    );
    
    res.json({
      notifications,
      pagination: {
        currentPage: Math.floor(offset / limit) + 1,
        limit,
        totalRecords: total[0].count,
        totalPages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch notifications'
    });
  }
});

// Get unread notification count
router.get('/unread/count', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM notification WHERE user_id = ? AND is_read = false',
      [req.userId]
    );
    
    res.json({
      unreadCount: result[0].count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch unread count'
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    
    // Verify ownership
    const [notifications] = await db.query(
      'SELECT user_id FROM notification WHERE id = ?',
      [req.params.notificationId]
    );
    
    if (notifications.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'Notification not found'
      });
    }
    
    if (notifications[0].user_id !== req.userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: 'Unauthorized'
      });
    }
    
    await db.query(
      'UPDATE notification SET is_read = true WHERE id = ?',
      [req.params.notificationId]
    );
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to update notification'
    });
  }
});

// Mark all notifications as read
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    
    await db.query(
      'UPDATE notification SET is_read = true WHERE user_id = ? AND is_read = false',
      [req.userId]
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to update notifications'
    });
  }
});

// Delete notification
router.delete('/:notificationId', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    
    // Verify ownership
    const [notifications] = await db.query(
      'SELECT user_id FROM notification WHERE id = ?',
      [req.params.notificationId]
    );
    
    if (notifications.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'Notification not found'
      });
    }
    
    if (notifications[0].user_id !== req.userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: 'Unauthorized'
      });
    }
    
    await db.query('DELETE FROM notification WHERE id = ?', [req.params.notificationId]);
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to delete notification'
    });
  }
});

// Delete all notifications
router.delete('/', verifyToken, async (req, res) => {
  try {
    const db = getPool();
    
    await db.query('DELETE FROM notification WHERE user_id = ?', [req.userId]);
    
    res.json({ message: 'All notifications deleted' });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to delete notifications'
    });
  }
});

/**
 * Helper function to create notifications
 * Use this function internally to create notifications for events
 */
const createNotification = async (userId, title, message, type, entityType, entityId) => {
  try {
    const db = getPool();
    await db.query(
      `INSERT INTO notification (user_id, title, message, type, related_entity_type, related_entity_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, message, type, entityType, entityId]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = router;
module.exports.createNotification = createNotification;
