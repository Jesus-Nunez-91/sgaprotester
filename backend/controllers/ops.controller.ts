import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { MaintenanceTask } from '../../src/entities/MaintenanceTask';
import { AdminTask } from '../../src/entities/AdminTask';
import { Project } from '../../src/entities/Project';

export const getMaintenanceTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await AppDataSource.getRepository(MaintenanceTask).find();
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};

export const saveMaintenanceTask = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(MaintenanceTask);
    const data = req.body;
    let task;
    if (data.id) {
      task = await repo.findOneBy({ id: Number(data.id) });
      if (task) Object.assign(task, data);
    }
    if (!task) task = repo.create(data);
    const saved = await repo.save(task as any);
    res.json(saved);
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};

export const deleteMaintenanceTask = async (req: Request, res: Response) => {
  try {
    await AppDataSource.getRepository(MaintenanceTask).delete(req.params.id);
    res.status(204).send();
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};

export const getAdminTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await AppDataSource.getRepository(AdminTask).find();
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};

export const saveAdminTask = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(AdminTask);
    const data = req.body;
    let task;
    if (data.id) {
      task = await repo.findOneBy({ id: Number(data.id) });
      if (task) Object.assign(task, data);
    }
    if (!task) task = repo.create(data);
    const saved = await repo.save(task as any);
    res.json(saved);
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};

export const deleteAdminTask = async (req: Request, res: Response) => {
  try {
    await AppDataSource.getRepository(AdminTask).delete(req.params.id);
    res.status(204).send();
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await AppDataSource.getRepository(Project).find();
    res.json(projects);
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};

export const saveProject = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Project);
    const data = req.body;
    let project;
    if (data.id) {
      project = await repo.findOneBy({ id: Number(data.id) });
      if (project) Object.assign(project, data);
    }
    if (!project) project = repo.create(data);
    const saved = await repo.save(project as any);
    res.json(saved);
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    await AppDataSource.getRepository(Project).delete(req.params.id);
    res.status(204).send();
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};
