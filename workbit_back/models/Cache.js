const mongoose = require('mongoose');

// Generic Cache Schema
const cacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  ttl: {
    type: Date,
    index: true
  },
  tags: [{
    type: String,
    index: true
  }],
  size: {
    type: Number,
    default: 0 // Size in bytes for cache management
  },
  hit_count: {
    type: Number,
    default: 0
  },
  last_accessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Space availability cache schema
const spaceAvailabilitySchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD format
    required: true,
    index: true
  },
  spaces: [{
    space_id: Number,
    space_name: String,
    status: String,
    capacity: Number,
    is_available: Boolean,
    reserved_slots: [{
      start_time: Date,
      end_time: Date,
      status: String
    }]
  }],
  last_updated: {
    type: Date,
    default: Date.now
  },
  expires_at: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// User session cache schema
const userSessionSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    required: true,
    index: true
  },
  session_token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user_data: {
    id: Number,
    name: String,
    lastname: String,
    username: String,
    role: String,
    cardCode: String
  },
  expires_at: {
    type: Date,
    required: true,
    index: true
  },
  last_activity: {
    type: Date,
    default: Date.now
  },
  ip_address: {
    type: String
  },
  user_agent: {
    type: String
  }
}, {
  timestamps: true
});

// API response cache schema
const apiResponseSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  query_hash: {
    type: String,
    required: true,
    index: true
  },
  response_data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status_code: {
    type: Number,
    required: true
  },
  expires_at: {
    type: Date,
    required: true,
    index: true
  },
  cache_hit_count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Configuration cache schema
const configurationSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    enum: ['system', 'ui', 'api', 'mqtt', 'database'],
    default: 'system'
  },
  is_public: {
    type: Boolean,
    default: false // Whether this config can be accessed by client-side
  },
  last_modified_by: {
    type: Number // user_id
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Create TTL indexes for automatic cleanup
cacheSchema.index({ ttl: 1 }, { expireAfterSeconds: 0 });
spaceAvailabilitySchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
userSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
apiResponseSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for better query performance
spaceAvailabilitySchema.index({ date: 1, last_updated: -1 });
userSessionSchema.index({ user_id: 1, expires_at: 1 });
apiResponseSchema.index({ endpoint: 1, method: 1, query_hash: 1 }, { unique: true });

// Cache helper methods
cacheSchema.methods.isExpired = function() {
  return this.ttl && new Date() > this.ttl;
};

cacheSchema.methods.incrementHit = function() {
  this.hit_count += 1;
  this.last_accessed = new Date();
  return this.save();
};

userSessionSchema.methods.isExpired = function() {
  return new Date() > this.expires_at;
};

userSessionSchema.methods.updateActivity = function() {
  this.last_activity = new Date();
  return this.save();
};

apiResponseSchema.methods.incrementHit = function() {
  this.cache_hit_count += 1;
  return this.save();
};

// Static methods for cache management
cacheSchema.statics.setCache = async function(key, value, ttlSeconds = 3600, tags = []) {
  const ttl = new Date(Date.now() + (ttlSeconds * 1000));
  const size = Buffer.byteLength(JSON.stringify(value), 'utf8');
  
  return this.findOneAndUpdate(
    { key },
    { 
      value, 
      ttl, 
      tags, 
      size,
      last_accessed: new Date(),
      $inc: { hit_count: 0 } // Reset hit count on update
    },
    { upsert: true, new: true }
  );
};

cacheSchema.statics.getCache = async function(key) {
  const cached = await this.findOne({ key });
  if (!cached || cached.isExpired()) {
    if (cached) {
      await this.deleteOne({ key });
    }
    return null;
  }
  
  await cached.incrementHit();
  return cached.value;
};

cacheSchema.statics.deleteByTags = async function(tags) {
  return this.deleteMany({ tags: { $in: tags } });
};

cacheSchema.statics.clearExpired = async function() {
  return this.deleteMany({ ttl: { $lte: new Date() } });
};

// Create models
const Cache = mongoose.model('Cache', cacheSchema);
const SpaceAvailability = mongoose.model('SpaceAvailability', spaceAvailabilitySchema);
const UserSession = mongoose.model('UserSession', userSessionSchema);
const ApiResponse = mongoose.model('ApiResponse', apiResponseSchema);
const Configuration = mongoose.model('Configuration', configurationSchema);

module.exports = {
  Cache,
  SpaceAvailability,
  UserSession,
  ApiResponse,
  Configuration
}; 