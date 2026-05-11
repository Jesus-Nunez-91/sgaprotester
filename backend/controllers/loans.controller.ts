import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { EquipmentLoan } from '../../src/entities/EquipmentLoan';
import { SpecialLoan } from '../../src/entities/SpecialLoan';
import { EquipmentInventory } from '../../src/entities/EquipmentInventory';

export const getLoans = async (req: Request, res: Response) => {
  try {
    const loans = await AppDataSource.getRepository(EquipmentLoan).find();
    res.json(loans);
  } catch (err) { res.status(500).json({ message: 'Error al obtener préstamos' }); }
};

export const saveLoan = async (req: Request, res: Response) => {
  try {
    const loanRepo = AppDataSource.getRepository(EquipmentLoan);
    const data = req.body;
    let loan;
    if (data.id) {
      loan = await loanRepo.findOneBy({ id: Number(data.id) });
      if (loan) Object.assign(loan, data);
    }
    if (!loan) loan = loanRepo.create(data);
    const saved = await loanRepo.save(loan as any);
    res.json(saved);
  } catch (err) { res.status(500).json({ message: 'Error al guardar préstamo' }); }
};

export const deleteLoan = async (req: Request, res: Response) => {
  try {
    await AppDataSource.getRepository(EquipmentLoan).delete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: 'Error al eliminar' }); }
};

export const updateLoanStatus = async (req: Request, res: Response) => {
  try {
    const loanRepo = AppDataSource.getRepository(EquipmentLoan);
    const loan = await loanRepo.findOneBy({ id: Number(req.params.id) });
    if (!loan) return res.status(404).json({ message: 'No encontrado' });
    loan.status = req.body.status;
    await loanRepo.save(loan);
    res.json(loan);
  } catch (err) { res.status(500).json({ message: 'Error al actualizar estado' }); }
};

export const getSpecialLoans = async (req: Request, res: Response) => {
  try {
    const loans = await AppDataSource.getRepository(SpecialLoan).find();
    res.json(loans);
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};

export const saveSpecialLoan = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(SpecialLoan);
    const data = req.body;
    let loan;
    if (data.id) {
      loan = await repo.findOneBy({ id: Number(data.id) });
      if (loan) Object.assign(loan, data);
    }
    if (!loan) loan = repo.create(data);
    const saved = await repo.save(loan as any);
    res.json(saved);
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};

export const deleteSpecialLoan = async (req: Request, res: Response) => {
  try {
    await AppDataSource.getRepository(SpecialLoan).delete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};

export const getEquipmentInventory = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(EquipmentInventory);
    let config = await repo.findOneBy({ configName: 'SGA_DEFAULT' });
    if (!config) config = await repo.save(repo.create({ configName: 'SGA_DEFAULT' }));
    res.json(config);
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};

export const updateEquipmentInventory = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(EquipmentInventory);
    let config = await repo.findOneBy({ configName: 'SGA_DEFAULT' });
    if (config) {
      Object.assign(config, req.body);
      await repo.save(config);
    }
    res.json(config);
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};
