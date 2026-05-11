import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { SystemSetting } from '../../src/entities/SystemSetting';

export const getRecaptchaSiteKey = (req: Request, res: Response) => {
    res.json({ siteKey: process.env.RECAPTCHA_SITE_KEY || '' });
};

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settingRepo = AppDataSource.getRepository(SystemSetting);
    const settings = await settingRepo.find();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener configuraciones' });
  }
};

export const upsertSetting = async (req: Request, res: Response) => {
  try {
    const { key, value, description } = req.body;
    const settingRepo = AppDataSource.getRepository(SystemSetting);
    
    let setting = await settingRepo.findOneBy({ key: key as string });
    if (setting) {
      setting.value = value;
      setting.description = description || setting.description;
    } else {
      setting = settingRepo.create({ key, value, description });
    }
    
    await settingRepo.save(setting);
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar configuración' });
  }
};

export const deleteSetting = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const settingRepo = AppDataSource.getRepository(SystemSetting);
    await settingRepo.delete({ key: key as string });
    res.json({ message: 'Configuración eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar configuración' });
  }
};
