type Props= {
    params: {
        storeSlug: string;
        experienceId?: string;
    }
}
export default async function NewProductPage({ params }: Props) {
    const storeSlug = params.storeSlug
    const experienceId = params.experienceId

    // const experience= experienceId ? await getExperienceDAO(experienceId) : null

    // const categories= await getAllCategorysDAO(storeSlug)

    return ( 
        <div className="flex-col">
          {/* <div className="flex-1 space-y-4 p-8 pt-6">
            <ExpeienceForm
              categories={categories} 
              initialData={experience}
            />
          </div> */}
        </div>
      );
}    