const express = require('express');
const router = express.Router();
const { Visit } = require('../models/Visit');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const path = require('path');
const PDFDocument = require('pdfkit');
const moment = require('moment-timezone');

router.get('/visitas', async (req, res) => {
  const visitas = await Visit.findAll({ order: [['createdAt', 'DESC']] });
  res.render('index', { visitas });
});

router.get('/', async (req, res) => {
  const agora = new Date();

  const inicioDoDia = moment().startOf('day').format('YYYY-MM-DD');  // 2025-04-18
  const fimDoDia = moment().endOf('day').format('YYYY-MM-DD');
    // inicioDoDia.setDate(inicioDoDia.getDate() - 1); 

  // const fimDoDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59);
  // fimDoDia.setDate(fimDoDia.getDate() - 1); 

  const visitas = await Visit.findAll({
    where: {
      data: {
        [Op.between]: [inicioDoDia, fimDoDia]
      }
    },
    order: [['data', 'ASC']],
  });

  res.render('index', { visitas });
});

router.get('/visitas/todas', async (req, res) => {
  const visitas = await Visit.findAll({ order: [['data', 'ASC']] });
  res.render('visitas', { visitas }); 
});

router.get('/relatorios', async (req, res) => {
  const visitas = await Visit.findAll({ order: [['createdAt', 'DESC']] });
  res.render('relatorios', { visitas });
});

router.get('/relatorio', async (req, res) => {
  const { tipo, dataInicio, dataFim } = req.query;

  const whereClause = {};
  if (dataInicio && dataFim) {
    const startDate = moment(dataInicio).startOf('day').format('YYYY-MM-DD');  // Início do dia (00:00:00)
    const endDate = moment(dataFim).endOf('day').format('YYYY-MM-DD');     
    // endDate.setDate(endDate.getDate() - 1);

    whereClause.data = {
      [Op.between]: [startDate, endDate],
    };
  }

  if (tipo === 'realizado') {
    whereClause.realizado = 'Sim';
  } else if (tipo === 'nao-realizado') {
    whereClause.realizado = 'Não';
  }

  const visitas = await Visit.findAll({
    where: whereClause,
    order: [['data', 'ASC']],
  });

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(__dirname, '../template.xlsx'));

  const sheet = workbook.getWorksheet('Abril - 2025');
  if (!sheet) return res.status(400).send('A aba "Abril - 2025" não foi encontrada.');

  let rowIndex = 6;
  visitas.forEach(v => {
    const row = sheet.getRow(rowIndex++);

    const values = [
      v.nome,
      v.documento,
      v.data,
      v.empresa,
      v.responsavel,
      v.terceirizado,
      v.realizado
    ];

    values.forEach((val, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      cell.value = val;
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    row.commit();
  });

  const totalRealizadas = visitas.filter(v => v.realizado === 'Sim').length;
  const totalNaoRealizadas = visitas.filter(v => v.realizado === 'Não').length;

  sheet.getCell('M8').value = totalRealizadas;
  sheet.getCell('M9').value = totalNaoRealizadas;

  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader('Content-Disposition', 'attachment; filename=relatorio_visitas.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

router.get('/new', (req, res) => {
  res.render('new');
});

router.post('/', async (req, res) => {
  await Visit.create(req.body);
  res.redirect('/');
});

router.get('/:id/edit', async (req, res) => {
  const visita = await Visit.findByPk(req.params.id);
  res.render('edit', { visita });
});

router.post('/:id', async (req, res) => {
  const visita = await Visit.findByPk(req.params.id);
  await visita.update(req.body);
  res.redirect('/');
});

router.post('/:id/delete', async (req, res) => {
  const visita = await Visit.findByPk(req.params.id);
  await visita.destroy();
  res.redirect('/');
});

router.get('/relatorio-pdf', async (req, res) => {
  const { tipo, dataInicio, dataFim } = req.query;

  const whereClause = {};
  if (dataInicio && dataFim) {
    const startDate = moment(dataInicio).startOf('day').format('YYYY-MM-DD');  // Início do dia (00:00:00)
    const endDate = moment(dataFim).endOf('day').format('YYYY-MM-DD');     
    // endDate.setDate(endDate.getDate() - 1);

    whereClause.data = {
      [Op.between]: [startDate, endDate],
    };
  }

  if (tipo === 'realizado') {
    whereClause.realizado = 'Sim';
  } else if (tipo === 'nao-realizado') {
    whereClause.realizado = 'Não';
  }

  const visitas = await Visit.findAll({
    where: whereClause,
    order: [['data', 'ASC']],
  });

  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=relatorio_visitas.pdf');
  doc.pipe(res);

  const img1Path = path.join(__dirname, '../public/assets/img1.png');
  const img2Path = path.join(__dirname, '../public/assets/img2.png');
  const headerHeight = 60;

  doc.image(img1Path, 30, 30, { width: 80, height: headerHeight });
  doc.image(img2Path, 500, 30, { width: 80, height: headerHeight });

  doc
    .fontSize(18)
    .text('Relatório de Visitas', 0, 45, { align: 'center', width: 595 });

    if (dataInicio && dataFim) {
      const startDate = moment(dataInicio).locale('pt-br').format('DD/MM/YYYY');
      const endDate = moment(dataFim).locale('pt-br').format('DD/MM/YYYY');
      const intervalText = `Período: ${startDate} a ${endDate}`;
      doc.fontSize(12).text(intervalText, 30, doc.y + 40);
      doc.moveDown(1);
    }
  

  doc.moveDown(4);

  const colWidths = [80, 80, 80, 80, 80, 80, 60];
  const headers = ['Nome', 'Documento', 'Data', 'Empresa', 'Responsável', 'Terceirizado', 'Realizado'];
  const startX = 30;
  let startY = doc.y;

  headers.forEach((header, i) => {
    doc.rect(startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), startY, colWidths[i], 20)
      .stroke()
      .fontSize(10)
      .text(header, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 2, startY + 5, {
        width: colWidths[i] - 4,
        height: 20,
      });
  });

  startY += 20;

  visitas.forEach(v => {
    const dataFormatada = moment(v.data).tz('America/Sao_Paulo').format('DD/MM/YYYY');
    const values = [
      v.nome,
      v.documento,
      dataFormatada,
      v.empresa,
      v.responsavel,
      v.terceirizado,
      v.realizado,
    ];

    values.forEach((text, i) => {
      doc.rect(startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0), startY, colWidths[i], 20)
        .stroke()
        .fontSize(9)
        .text(text, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 2, startY + 5, {
          width: colWidths[i] - 4,
          height: 20,
        });
    });

    startY += 20;

    if (startY > 750) {
      doc.addPage();
      startY = 30;
    }
  });

  startY += 20;

  const totalRealizadas = visitas.filter(v => v.realizado === 'Sim').length;
  const totalNaoRealizadas = visitas.filter(v => v.realizado === 'Não').length;

  doc
    .fontSize(12)
    .text(`Total Realizadas: ${totalRealizadas}`, startX, startY + 10)
    .text(`Total Não Realizadas: ${totalNaoRealizadas}`, startX, startY + 30);

  doc.end();
});

module.exports = router;
