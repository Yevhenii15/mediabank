<template>
  <div v-if="equipment"
    class="w-[100%] px-[5%] flex flex-wrap justify-center font-futura pt-10 relative top-[7vh] lg:top-[15vh] mb-[15vh] lg:mb-[25vh]">

    <!-- Buttons for other equipment pages -->
    <div class="lg:flex flex-col w-[25%] lg:w-[11%] fixed left-0 hidden">
      <button v-for="item in allEquipment" :key="item.id"
        :class="['bg-white flex text-main border border-main rounded-e-3xl p-2 pl-4 lg:pl-7 uppercase my-3 font-bold border-l-0', { 'active-filter': item.id === equipmentId }]"
        @click="goToEquipment(item.id)">
        {{ item.equipmentName }}
      </button>
    </div>

    <!-- Buttons for other equipment pages mobile -->
    <div class="flex justify-between w-[90%] lg:hidden">
      <button v-for="item in allEquipment" :key="item.id"
        :class="['bg-white flex w-[31%] text-main border border-main rounded-xl  justify-center p-2 uppercase my-5 font-bold', { 'active-filter': item.id === equipmentId }]"
        @click="goToEquipment(item.id)">
        {{ item.equipmentName }}
      </button>
    </div>

    <div class="pictures w-[90%] lg:w-[50%] flex-col flex items-center">
      <!-- Main equipment image -->
      <div class="relative w-[100%] flex justify-center">
        <img class=" w-[100%] lg:w-96 h-96 object-cover object-center cursor-pointer border border-main"
          :src="equipment.equipmentImages[0]" alt="Main Equipment Image" @click="toggleDeleteButton(0)" />
      </div>

      <!-- Additional equipment images -->
      <div class="lg:w-96 w-[100%]">
        <div class="w-[103%] gap-[3%] flex flex-wrap">
          <div v-for="(image, index) in equipment.equipmentImages.slice(1)" :key="index" class="relative w-[22%] mt-5">
            <img class="border w-[100%] h-24 border-main object-cover object-center cursor-pointer" :src="image"
              alt="Equipment Image" @click="toggleDeleteButton(index + 1)" />
          </div>
        </div>
      </div>

      <!-- Button to add more images -->
      <div class="lg:w-96 w-[100%] mt-5 flex">
        <div v-if="isAdminUser">
          <input class="hidden" type="file" id="imageInput" name="file" @change="handleImageUpload($event, equipment)"
            multiple :data-equipment="equipment.id" />
          <button
            class="bg-white text-main border border-main px-4 py-2 rounded-lg hover:bg-main hover:text-white font-futura"
            @click="openFileInput('imageInput')">Add Photo</button>
        </div>

        <!-- Delete button for the selected image -->
        <div v-if="isAdminUser">
          <button v-if="selectedImage !== null" @click="deleteImageHandler(equipment, selectedImage)"
            class="bg-main text-white border ml-4 px-4 py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>

    <!-- Equipment information -->
    <div class="info w-[90%] lg:w-[50%] flex flex-col">
      <h1 class="w-[100%] uppercase text-[50px] text-text">{{ newEquipmentName }}</h1>
      <h1 class="text-text uppercase my-3 text-p">Description</h1>
      <p class="w-[100%]">{{ newEquipmentDescription }}</p>

      <div class="mt-7 w-[100%]">
        <h1 class="text-text uppercase text-p">Files</h1>
        <!-- Language Filter Dropdown -->
        <div>
          <select v-model="selectedFilterLanguage" class="border border-main p-2 rounded-lg">
            <option value="">All Languages</option>
            <option value="danish">Danish</option>
            <option value="english">English</option>
            <option value="polish">Polish</option>
            <option value="ukrainian">Ukrainian</option>
          </select>
        </div>

        <!-- List of files -->
        <ul class="my-3">
          <li v-for="(file, index) in filteredFiles" :key="index" class="flex justify-between my-2">
            <a class="my-1" :href="file.url" download>{{ getFileName(file.url) }}</a>
            <div class="flex">
              <button v-if="isAdminUser" @click="deleteFileHandler(equipment, index)"
                class="text-text underline lg:px-[20px] rounded-lg mr-2 lg:mr-5">Delete File</button>
              <button
                class="bg-white text-main border border-main lg:px-[40px] px-3 rounded-lg lg:mr-5 hover:bg-main hover:text-white"
                @click="downloadFile(file.url)">Download File</button>
            </div>
          </li>
        </ul>

        <!-- Add File Input and Language Selection -->
        <div v-if="isAdminUser">

          <div v-if="errorMessage" class="w-[65%] my-4 text-red-500 bg-red-100 border border-red-400 rounded-xl p-2">
            {{ errorMessage }}
          </div>

          <input class="hidden" type="file" id="fileInput" name="file" @change="handleFileUpload($event, equipment)"
            multiple :data-equipment="equipment.id" />
          <select v-model="selectedLanguage" class="border border-main p-2 rounded-lg">
            <option disabled value="">Select Language</option>
            <option value="danish">Danish</option>
            <option value="english">English</option>
            <option value="polish">Polish</option>
            <option value="ukrainian">Ukrainian</option>
          </select>
          <button
            class="bg-white text-main border border-main px-4 py-2 rounded-lg hover:bg-main hover:text-white font-futura ml-5"
            @click="openFileInput('fileInput')">Add File</button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import useEquipment from '../modules/equipment.js';
import isAdmin from '../modules/isAdmin.js';
import { auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

const {
  getEquipmentById,
  handleImageUpload,
  deleteImage,
  handleFileUpload,
  deleteFile,
  getAllEquipment,
  downloadFile,
  selectedLanguage,
  errorMessage,
} = useEquipment();

const route = useRoute();
const router = useRouter();
const equipmentId = ref(route.params.id);
const equipment = ref(null);
const isAdminUser = ref(false);
const selectedImage = ref(null);

const newEquipmentName = ref('');
const newEquipmentDescription = ref('');
const allEquipment = ref([]);

const selectedFilterLanguage = ref('');

const filteredFiles = computed(() => {
  if (!selectedFilterLanguage.value) {
    return equipment.value.equipmentFiles;
  }
  return equipment.value.equipmentFiles.filter(file => file.language === selectedFilterLanguage.value);
});

const clearErrorMessage = () => {
  setTimeout(() => {
    errorMessage.value = '';
  }, 3000);
};

const toggleDeleteButton = (index) => {
  if (selectedImage.value === index) {
    selectedImage.value = null;
  } else {
    selectedImage.value = index;
  }
};

const deleteImageHandler = (equipment, selectedImageIndex) => {
  deleteImage(equipment, selectedImageIndex).then(() => {
    // Check if the deleted image was the currently selected one
    if (selectedImage.value === selectedImageIndex) {
      // Reset selectedImage to null
      selectedImage.value = null;
    }
  }).catch(error => {
    console.error('Error deleting image:', error);
  });
};


const deleteFileHandler = (equipment, index) => {
  deleteFile(equipment, index).catch(error => {
    console.error('Error in deleteFileHandler:', error);
  });
};

const openFileInput = (inputId) => {
  document.getElementById(inputId).click();
};

const goToEquipment = (id) => {
  router.push(`/equipment/${id}`);
};

const getFileName = (fileUrl) => {
  // Decode the URL
  const decodedUrl = decodeURIComponent(fileUrl);
  // Split the decoded URL by '/' and get the last element
  const parts = decodedUrl.split('/');
  // Get the last part of the URL
  const fileNameWithExtension = parts[parts.length - 1];
  // Split the filename by '.' and get the first part (filename without extension)
  const fileName = fileNameWithExtension.split('.')[0];
  return fileName;
};

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isAdmin(user.uid)
        .then((isAdmin) => {
          isAdminUser.value = isAdmin;
        })
        .catch((error) => {
          console.error('Error checking admin role:', error);
        });
    }
  });


  // Watch for changes in the errorMessage value and set a timer to clear it
  watch(errorMessage, () => {
    clearErrorMessage();
  });
  getEquipmentById(equipmentId.value).then((fetchedEquipment) => {
    equipment.value = fetchedEquipment;
    newEquipmentName.value = fetchedEquipment.equipmentName;
    newEquipmentDescription.value = fetchedEquipment.equipmentDescription;
  });

  getAllEquipment().then((fetchedAllEquipment) => {
    allEquipment.value = fetchedAllEquipment;
  });
});

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      equipmentId.value = newId;
      getEquipmentById(newId).then((fetchedEquipment) => {
        equipment.value = fetchedEquipment;
        newEquipmentName.value = fetchedEquipment.equipmentName;
        newEquipmentDescription.value = fetchedEquipment.equipmentDescription;
      });
    }
  }
);


</script>


<style scoped>
.active-filter {
  background-color: #5d89b3;
  /* Change to your desired active color */
  color: white;
}
</style>
