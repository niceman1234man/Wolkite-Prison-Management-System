import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import cors from 'cors';
import { Inmate } from '../../model/inmate.model.js';
import * as inmateController from '../../controller/inmate.controller.js';

// Mock dependencies
jest.mock('../controllers/archive.controller.js', () => ({
  archiveItem: jest.fn().mockResolvedValue({ success: true })
}));

// Create Express app for testing
const app = express();
app.use(cors());
app.use(express.json());

// Set up routes for testing
app.get('/api/inmates', inmateController.getAllInmates);
app.get('/api/inmates/:id', inmateController.getInmate);
app.post('/api/inmates', inmateController.addnewInmate);
app.put('/api/inmates/:id', inmateController.updateInmate);
app.delete('/api/inmates/:id', inmateController.deleteInmate);

describe('Inmate API Tests', () => {
  let mongoServer;
  
  // Set up MongoDB Memory Server before tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    await mongoose.connect(uri);
  });
  
  // Clean up after tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  // Clear database between tests
  beforeEach(async () => {
    await Inmate.deleteMany({});
  });
  
  // Sample inmate data for testing
  const sampleInmate = {
    firstName: 'John',
    middleName: 'Robert',
    lastName: 'Doe',
    birthDate: new Date('1990-01-01'),
    age: 33,
    gender: 'male',
    motherName: 'Jane Doe',
    nationality: 'Ethiopian',
    caseType: 'Theft',
    startDate: new Date('2022-01-01'),
    sentenceYear: 2,
    releasedDate: new Date('2024-01-01'),
    guiltyStatus: 'guilty',
    status: 'active'
  };
  
  describe('GET /api/inmates', () => {
    test('should return empty array when no inmates exist', async () => {
      const response = await request(app).get('/api/inmates');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.inmates).toEqual([]);
    });
    
    test('should return all inmates', async () => {
      // Create sample inmates first
      await Inmate.create(sampleInmate);
      await Inmate.create({
        ...sampleInmate,
        firstName: 'Jane',
        lastName: 'Smith'
      });
      
      const response = await request(app).get('/api/inmates');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.inmates.length).toBe(2);
      expect(response.body.inmates[0]).toHaveProperty('firstName', 'John');
      expect(response.body.inmates[1]).toHaveProperty('firstName', 'Jane');
    });
  });
  
  describe('GET /api/inmates/:id', () => {
    test('should return 400 if inmate ID does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/inmates/${fakeId}`);
      
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Inmate does not exist');
    });
    
    test('should return inmate by ID', async () => {
      // Create sample inmate first
      const createdInmate = await Inmate.create(sampleInmate);
      
      const response = await request(app).get(`/api/inmates/${createdInmate._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.inmate).toHaveProperty('_id', createdInmate._id.toString());
      expect(response.body.inmate).toHaveProperty('firstName', 'John');
    });
  });
  
  describe('POST /api/inmates', () => {
    test('should create a new inmate', async () => {
      const response = await request(app)
        .post('/api/inmates')
        .send(sampleInmate);
      
      expect(response.status).toBe(201);
      expect(response.body.error).toBe(false);
      expect(response.body.message).toBe('New Inmate registered successfully');
      
      // Verify inmate was created in database
      const inmates = await Inmate.find();
      expect(inmates.length).toBe(1);
      expect(inmates[0].firstName).toBe('John');
    });
    
    test('should return 400 if required fields are missing', async () => {
      const incompleteInmate = {
        firstName: 'John'
        // Missing other required fields
      };
      
      const response = await request(app)
        .post('/api/inmates')
        .send(incompleteInmate);
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('PUT /api/inmates/:id', () => {
    test('should update an existing inmate', async () => {
      // Create sample inmate first
      const createdInmate = await Inmate.create(sampleInmate);
      
      const updatedData = {
        ...sampleInmate,
        firstName: 'Updated',
        caseType: 'Robbery'
      };
      
      const response = await request(app)
        .put(`/api/inmates/${createdInmate._id}`)
        .send(updatedData);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Inmate information updated successfully');
      
      // Verify inmate was updated in database
      const updatedInmate = await Inmate.findById(createdInmate._id);
      expect(updatedInmate.firstName).toBe('Updated');
      expect(updatedInmate.caseType).toBe('Robbery');
    });
    
    test('should return 404 if inmate does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/inmates/${fakeId}`)
        .send(sampleInmate);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Inmate not found');
    });
  });
  
  describe('DELETE /api/inmates/:id', () => {
    test('should delete an existing inmate', async () => {
      // Create test user in request
      const req = { user: { id: new mongoose.Types.ObjectId().toString() } };
      app.use((request, _, next) => {
        request.user = req.user;
        next();
      });
      
      // Create sample inmate first
      const createdInmate = await Inmate.create(sampleInmate);
      
      const response = await request(app)
        .delete(`/api/inmates/${createdInmate._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Inmate deleted successfully');
      
      // Verify inmate was deleted from database
      const deletedInmate = await Inmate.findById(createdInmate._id);
      expect(deletedInmate).toBeNull();
    });
    
    test('should return 404 if inmate does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/inmates/${fakeId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Inmate not found');
    });
  });
}); 