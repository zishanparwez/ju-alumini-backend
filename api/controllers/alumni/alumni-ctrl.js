const Joi = require("joi");
const qs = require("qs");
const roles = require("../../roles");
const { KEY } = require("../../config/index");
const Alumni = require("../../models/alumni/alumni");

/**
 * Get Institute by id
 * id given in params
 * route -------- /:id
 */
const getAlumnusById = async (req, res) => {
  const alumnusId = req.params.id;

  try {
    const alumnus = await Alumni.findOne({ _id: alumnusId });

    if (!alumnus) {
      return res.status(404).json({
        message: "Alumnus does not exist",
        success: false,
      });
    }

    return res.status(200).json({
      alumnus: alumnus,
      message: "Alumnus found",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Unable to get alumnus",
      success: false,
    });
  }
};

/**
 * Get Alumnus/Alumni by queries
 * route ----- /:query
 */
const getAlumni = async (req, res) => {
  //Query Type Enum
  const QUERY_TYPE = {
    text: "text",
    custom: "custom",
  };
  Object.freeze(QUERY_TYPE);

  const query = qs.parse(req.params.query);
  const { query_type, qry } = query;

  //Validate Query type
  try {
    Joi.attempt(
      query_type,
      Joi.string().valid(QUERY_TYPE.text, QUERY_TYPE.custom).required()
    );
  } catch (ValidationError) {
    return res.status(422).json({
      message: "Validation Error",
      query: query,
      success: false,
    });
  }

  let filterParameter;

  //Text Search
  if (query_type === QUERY_TYPE.text) {
    //Validate Query type
    try {
      Joi.attempt(qry, Joi.string().min(1).max(50));
    } catch (ValidationError) {
      return res.status(422).json({
        message: "Validation Error",
        success: false,
      });
    }

    filterParameter = {
      $text: { $search: qry },
    };
  } else {
    //Custom Search Validation
    try {
      Joi.attempt(
        qry,
        Joi.object({
          name: Joi.string(),
          degree: Joi.string(),
          stream: Joi.string(),
          profession: Joi.string(),
          company: Joi.string(),
        }).min(1)
      );
    } catch (ValidationError) {
      return res.status(422).json({
        message: "Validation Error",
        success: false,
      });
    }

    const and_filters = [];

    for (const ops in qry) {
      if (qry[ops].length === 0) {
        continue;
      }

      const obj = {};
      obj[ops] = qry[ops];
      and_filters.push(obj);
    }

    filterParameter = { $and: and_filters };
  }

  try {
    const alumni = await Alumni.find(filterParameter);

    return res.status(200).json({
      count: alumni.length,
      alumni: alumni,
      message: "Alumni found",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Unable to get alumni",
      success: false,
    });
  }
};

/**
 * Post Alumnus
 * route ------ /
 */
const postAlumnus = async (req, res) => {
  const alumnusDets = req.body;

  if (req.user.role === roles.user) {
    return req.status(401).json({
      message: "Unauthorized",
      status: false,
    });
  }

  //Joi schema for validation
  const schema = Joi.object({
    name: Joi.string().required(),
    linkedIn: Joi.string().required(),
    degree: Joi.string(),
    stream: Joi.string(),
    address: Joi.string(),
    profession: Joi.string(),
    company: Joi.string(),
  });

  //Validate Data
  try {
    Joi.attempt(alumnusDets, schema);
  } catch (ValidationError) {
    return res.status(422).json({
      message: "Validation Error",
      success: false,
    });
  }

  try {
    // Check if alumnus already exists
    const alumnus = await Alumni.findOne({
      linkedIn: alumnusDets.linkedIn,
    });

    if (alumnus) {
      return res.status(409).json({
        message: "Alumnus already exists",
        success: false,
      });
    }

    const newAlumnus = new Alumni({
      ...alumnusDets,
    });

    await newAlumnus.save();
    return res.status(201).json({
      message: "Alumnus uploaded successfully",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Unable to upload alumnus",
      success: false,
    });
  }
};

/**
 * Delete Institute by id
 * id given in request params
 * route -------- /:id
 */
const deleteAlumnus = async (req, res) => {
  const alumnusId = req.params.id;

  if (req.user.role === roles.user) {
    return req.status(401).json({
      message: "Unauthorized",
      status: false,
    });
  }

  try {
    const alumnus = await Alumni.findOne({ _id: alumnusId });
    if (!alumnus) {
      return res.status(404).json({
        message: "Alumnus does not exist",
        success: false,
      });
    }

    try {
      await Alumni.deleteOne({ _id: alumnusId });
      return res.status(200).json({
        message: "Alumnus deleted successfully",
        success: true,
      });
    } catch (err) {
      return res.status(500).json({
        message: "Unable to delete alumnus",
        success: false,
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Unable to delete institute",
      success: false,
    });
  }
};

/**
 * Update Institute by id
 * id given in params
 * route --------- /:id
 */
const updateAlumnus = async (req, res, next) => {
  const alumnusDets = req.body;
  const alumnusId = req.params.id;

  if (req.user.role === roles.user) {
    return req.status(401).json({
      message: "Unauthorized",
      status: false,
    });
  }

  //Joi schema for validation
  const schema = Joi.object({
    name: Joi.string(),
    degree: Joi.string(),
    stream: Joi.string(),
    address: Joi.string(),
    profession: Joi.string(),
    company: Joi.string(),
  });

  //Validate Data
  try {
    Joi.attempt(alumnusDets, schema);
  } catch (ValidationError) {
    return res.status(422).json({
      message: "Validation Error",
      success: false,
    });
  }

  try {
    const alumnus = await Alumni.findOne({ _id: alumnusId });

    if (!alumnus) {
      return res.status(404).json({
        message: "Alumnus does not exist",
        success: false,
      });
    }

    await Alumni.updateOne(
      { _id: alumnusId },
      {
        $set: alumnusDets,
        $currentDate: { lastModified: true },
      }
    );

    return res.status(200).json({
      message: "Alumnus updated successfully",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Unable to update institute",
      success: false,
    });
  }
};

module.exports = {
  postAlumnus,
  updateAlumnus,
  getAlumni,
  deleteAlumnus,
  getAlumnusById,
};
