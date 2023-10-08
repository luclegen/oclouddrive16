const { ForbiddenError } = require('@casl/ability')
const _ = require('lodash')
const fs = require('fs')
const createError = require('http-errors')
const File = require('../models/file.model')
const Folder = require('../models/folder.model')
const catchAsync = require('../middlewares/catcher.middleware')
const checker = require('../helpers/checker')
const converter = require('../helpers/converter')
const duplicator = require('../helpers/duplicator')

module.exports.create = catchAsync(async (req, res, next) => {
  if (!req.body.name) return next(createError(400, 'Name is required.'))

  const files = await File.find({ _uid: req.payload, name: req.body.name, path: req.body.path }).accessibleBy(req.ability)

  if (files.length) return next(createError(422, 'File is duplicate.\nPlease choose another file.'))

  let file = new File()

  file._uid = req.user
  file.path = req.body.path
  file.name = req.body.name

  ForbiddenError.from(req.ability).throwUnlessCan('create', file)

  file = await file.save()

  if (!file) return next(createError(404, 'File not found.'))

  res.status(201).json(req.t('Uploaded successfully.'))
})

module.exports.createPlaintext = catchAsync(async (req, res, next) => {
  if (!req.body.name) return next(createError(400, 'Name is required.'))
  if (!checker.isPlaintext(req.body.name)) return next(createError(400, 'Invalid plain text document file name.'))

  const files = await File.find({ _uid: req.payload, name: req.body.name, path: req.body.path }).accessibleBy(req.ability)

  if (files.length) return next(createError(422, 'File is duplicate.\nPlease choose another file.'))

  let file = new File()

  file._uid = req.payload
  file.path = req.body.path
  file.name = req.body.name

  ForbiddenError.from(req.ability).throwUnlessCan('create', file)

  file = await file.save()

  if (!file) return next(createError(404, 'File not found.'))

  fs.openSync(`${converter.toUploadFilePath(req.payload._id, { path: req.body.path, name: req.body.name })}`, 'w')

  res.status(201).json(req.t('Created successfully.'))
})

module.exports.download = (req, res, next) =>
  File.findById(req.params.id)
    .then(file => res.download(converter.toUploadFilePath(file._uid, file)))
    .catch(err => next(err))

module.exports.read = (req, res, next) =>
  File.findById(req.params.id)
    .then(file => res.json(_.pick(file, ['path', 'name', 'is_trash'])))
    .catch(err => next(err))

module.exports.update = (req, res, next) => req.body.name
  ? File.findById(req.params.id)
    .then(file =>
      File.find({ _uid: req.payload, name: req.body.name, path: file.path })
        .then(files =>
          files.length
            ? res.status(422).json('You already have a file in the current path. Please a different name.')
            : File.findByIdAndUpdate(req.params.id, { $set: { name: req.body.name } }, { new: true })
              .then(fileEdited =>
                fileEdited
                  ? fs.rename(
                    converter.toUploadFilePath(req.payload._id, file),
                    converter.toUploadFilePath(req.payload._id, fileEdited),
                    err => err
                      ? next(err)
                      : res.json())
                  : res.status(404).json('File not found.'))
              .catch(err => next(err)))
        .catch(err => next(err)))
    .catch(err => next(err))
  : res.status(403).json('Name is required.')

module.exports.delete = (req, res, next) =>
  File.findByIdAndUpdate(req.params.id, { $set: { is_trash: true } }, { new: true })
    .then(file => file ? res.json() : res.status(404).json('File not found.'))
    .catch(err => next(err))

module.exports.restore = (req, res, next) =>
  File.findByIdAndUpdate(req.params.id, { $set: { is_trash: false } }, { new: true })
    .then(file => file ? res.json() : res.status(404).json('File not found.'))
    .catch(err => next(err))

module.exports.move = (req, res, next) => File.findById(req.params.id)
  .then(async (file, destFolder = undefined) =>
    (destFolder = req.body.did === 'Root' ? undefined : await Folder.findById(req.body.did)) +
      file
      ? File.find({ _uid: req.payload, name: file.name, path: destFolder ? converter.toPath(destFolder) : '/' })
        .then(files => files.length
          ? res.status(422).json('You already have a file in the current path! Please choose another file.')
          : File.findByIdAndUpdate(req.params.id, { $set: { path: destFolder ? converter.toPath(destFolder) : '/' } }, { new: true })
            .then(movedFile => movedFile
              ? fs.rename(
                converter.toUploadFilePath(req.payload._id, file),
                (destFolder ? converter.toUploadPath(req.payload._id, destFolder) : process.env.UPLOADS + req.payload._id + '/files') + '/' + file.name,
                err => err
                  ? next(err)
                  : res.json('Done.'))
              : res.status(404).json('Moved folder not found!'))
            .catch(err => next(err)))
        .catch(err => next(err))
      : res.status(404).json('Folder not found!'))
  .catch(err => next(err))

module.exports.copy = (req, res, next) => File.findById(req.params.id)
  .then(async (file, destFolder = undefined) =>
    (destFolder = req.body.did === 'Root' ? undefined : await Folder.findById(req.body.did)) +
      file
      ? File.find({ _uid: req.payload, path: destFolder ? converter.toPath(destFolder) : '/' })
        .then(files => {
          const newFile = File()

          newFile._uid = req.payload
          newFile.name = duplicator.copyFileInFolder(file.name, files.map(v => v.name))
          newFile.path = destFolder ? converter.toPath(destFolder) : '/'

          newFile.save()
            .then(copiedFile => copiedFile
              ? fs.cp(
                converter.toUploadFilePath(req.payload._id, file),
                (destFolder ? converter.toUploadPath(req.payload._id, destFolder, files.map(v => v.name)) : process.env.UPLOADS + req.payload._id + '/files') + '/' + duplicator.copyFileInFolder(file.name, files.map(v => v.name)),
                err => err
                  ? next(err)
                  : res.json('Done.'))
              : res.status(404).json('File isn\'t copied!'))
        })
        .catch(err => next(err))
      : res.status(404).json('Folder not found!'))
  .catch(err => next(err))

module.exports.deleteForever = (req, res, next) =>
  File.findById(req.params.id)
    .then(file =>
      file
        ? file.is_trash
          ? File.findByIdAndDelete(req.params.id)
            .then(file =>
              file
                ? fs.rm(converter.toUploadFilePath(req.payload._id, file),
                  { recursive: true },
                  err => err
                    ? next(err)
                    : res.json())
                : res.status(404).json('File not found.'))
            .catch(err => next(err))
          : res.status(403).json('File not in trash.')
        : res.status(404).json('File not found.'))
    .catch(err => next(err))

module.exports.list = (req, res, next) =>
  File.find({ _uid: req.payload, name: new RegExp(req.query.name, 'ig') })
    .then(files => res.status(201).json(files))
    .catch(err => next(err))
