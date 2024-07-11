import VectorGPTService from "./vector-gpt.service";

class VectorGPTController {
    private vectorGPTService: VectorGPTService;

    constructor(vectorGPTService: VectorGPTService) {
        this.vectorGPTService = vectorGPTService;
    }

    createTotalMarks= async (req,res) => {
        try {
            const { userJSONdata, neededSkills } = req.body;
            const points = await this.vectorGPTService.createTotalMarks(userJSONdata, neededSkills);
            res.status(200).json(points);
        } catch (error) {
            console.error('Error in createTotalMarks:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default VectorGPTController;
